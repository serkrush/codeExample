import {log, bug} from '../log';
import { Request, Response, Router  } from 'express';
import mongoose from 'mongoose';

import { initGuard } from '../acl/cleaner';
import status from '../../app/http-status';
import { Coupon } from '../models/coupon';
import { GRANT } from '../../server/acl/types';

// const mongoose = require("mongoose");
const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
    const query: any = { };
    const ObjectId = mongoose.Types.ObjectId;
    if (req.query.hasOwnProperty('id') && req.query.id) {
        query['_id'] =  ObjectId(req.query.id);
    }
    if (req.query.hasOwnProperty('couponCode') && req.query.couponCode) {
        query['couponCode'] =  req.query.couponCode;
    }
    // only admin can select all coupons
    let isAllow = true;
    if (Object.keys(query).length === 0) {
        const guard = initGuard(req.session.identity);
        isAllow = guard.allow('/coupon', GRANT.EXECUTE);
    }
    if (isAllow) {
        return Coupon.find(query).then((items) => {
            return res.json({
                success: true,
                data: items,
            });
        }).catch((err: any) => {
            bug(err);
            return res.status(status.NOT_FOUND).json({
                success: false,
                message: 'Can\'t find coupon',
            });
        });
    }
    return res.status(status.NOT_FOUND).json({
        success: false,
        message: 'Can\'t find coupon',
    });
});

router.post('/', (req: Request, res: Response) => {
    log('fetch Coupon', req.body);
    const page = parseInt(req.body.page || 0);
    const perPage = parseInt(req.body.perPage || 100);
    const filter = req.body.hasOwnProperty('filter') ? req.body.filter : null;
    const sort = req.body.hasOwnProperty('sort') ? req.body.sort : null;
    return Coupon.page(page, perPage, filter, sort).then(({coupons, count}) => {
        return res.json({
            success: true,
            data: coupons,
            pager: {
                page,
                count,
            },
        });
    }).catch((err: any) => {
        bug(err);
        return res.status(status.NOT_FOUND).json({
            success: false,
            message: 'Can\'t find Coupon',
        });
    });
});

router.put('/', (req: Request, res: Response) => {
    log('save Coupon', req.body);

    const save = (item: any) => {
        for (const key in req.body) {
            if (req.body.hasOwnProperty(key)) {
                item[key] = req.body[key];
            }
        }
        return item.save()
            .then((item: any) => res.json({
                    success: true,
                    message: 'Coupon was updated successfully',
                    data: [ item.toObject() ],
                }),
            ).catch((err: any) => {
                bug(err);
                return res.status(status.METHOD_NOT_ALLOWED).json({
                    success: false,
                    message: 'Can\'t save coupon to the db',
                });
            });
    };

    if (req.body.id) {
        return Coupon.findById(req.body.id)
            .then(save)
            .catch((err) => res.status(status.NOT_FOUND).json({
                success: false,
                message: 'Can\'t select coupon from db',
            }));
    }
    const coupon = new Coupon();
    return save(coupon);
});

router.delete('/', (req: Request, res: Response) => {
    log('delete coupons', req.body);
    return Coupon.findById(req.body.id)
            .then((item: any) =>
                item.remove()
                .then(() => {
                    res.json({
                        success: true,
                        message: 'Coupon was deleted successfully',
                    });
            }),
            ).catch((err) => res.status(status.NOT_FOUND).json({
                success: false,
                message: 'Can\'t delete coupon from db',
            }));

});

router.get('/check', (req: Request, res: Response) => {
    log('checkcoupon', req.query);
    const { couponCode } = req.query;
    if (couponCode) {
        let query = [{ couponCode }];
        if ('ne' in req.query) {
            query = [ ...query, { couponCode: { $ne: req.query.ne } }] ;
        }
        return Coupon.count({ $and: query},
            function(err, count) {
                if (err) {
                    return res.status(status.NOT_FOUND).json({
                        success: false,
                        message: 'Can\'t select coupon from db',
                    });
                }
                return res.json({
                    success: true,
                    data: {
                        couponCode: req.query.couponCode,
                        exist: count > 0,
                    },
                });
        });

    } else {
        return res.status(status.METHOD_NOT_ALLOWED).json({
            success: false,
            message: 'Can\'t check code of coupont',
        });
    }
});

router.get('/isactive', (req: Request, res: Response) => {
    log('is coupone active', req.query);
    const { couponCode } = req.query;
    if (couponCode) {
        const query = {
            $and: [
                { couponCode },
                { status: true },
                { validFrom: { $lte : Date.now() } },
                { validTo: { $gte : Date.now() } },
            ],
        };
        return Coupon.count(query).then((count) => {
                return res.json({
                    success: true,
                    data: {
                        couponCode: req.query.couponCode,
                        isActive: count > 0,
                    },
                });
        }).catch((err: any) => {
            bug(err);
            return res.status(status.NOT_FOUND).json({
                success: false,
                message: 'Can\'t select coupon from db',
            });
        });

    } else {
        return res.status(status.METHOD_NOT_ALLOWED).json({
            success: false,
            message: 'Can\'t check code of coupont',
        });
    }
});

export default router;

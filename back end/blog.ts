import { Request, Response, Router  } from "express";
import fetch from 'cross-fetch';

import { bug } from '../log';
import status from '../../app/http-status';


const config = require('../../config');
const queryString = require('query-string');
const router: Router = Router();
// const testUrl = 'https://blog.spellquiz.com:81';


router.get('/posts', (req: Request, res: Response) => {
    const page = req.query.page ? req.query.page : 1;
    let stringified = queryString.stringify(req.query);
    stringified = stringified ? '?' + stringified : stringified;
    return fetch(`${config.blogUrl}${stringified}`).then((response) => {
    // return fetch(`${testUrl}${stringified}`).then((response) => {
        response.json().then((json) => {
            if (json.data && json.data.status === 400) {
                return res.status(status.NOT_FOUND).json({
                    success: false,
                    message: 'Can\'t find blogs',
                });
            } else {
                return res.json({
                    success: true,
                    data: replaceUnhandledUnicode(json),
                    pager: {
                        page: parseInt(page),
                        count: response.headers.get('x-wp-total'),
                    },
                });
            }
        });
    }).catch(err => {
        bug(err);
        return res.status(status.NOT_FOUND).json({
            success: false,
            message: 'Can\'t find blogs',
        });
    });
});

router.get('/featured', (req: Request, res: Response) => {
    return fetch(`${config.blogUrl}?featured=true`).then((response) => {
        response.json().then((json) => {
            if (json.data && json.data.status === 400) {
                return res.status(status.NOT_FOUND).json({
                    success: false,
                    message: 'Can\'t find blogs',
                });
            } else {
                return res.json({
                    success: true,
                    data: replaceUnhandledUnicode(json),
                });
            }
        });
    }).catch(err => {
        bug(err);
        return res.status(status.NOT_FOUND).json({
            success: false,
            message: 'Can\'t find blogs',
        });
    });
});

function replaceUnhandledUnicode(str: string) {
    str = JSON.stringify(str);
    const toReplace = [
        {
            find: '\u0091',
            replace: '&#144;',
        },
        {
            find: '\u0091',
            replace: '&#145;',
        },
        {
            find: '\u0092',
            replace: '&#146;',
        },
        {
            find: '\u0093',
            replace: '&#147;',
        },
        {
            find: '\u0094',
            replace: '&#148;',
        },
        {
            find: '\u0095',
            replace: '&#149;',
        },
        {
            find: '\u0096',
            replace: '&#150;',
        },
        {
            find: '\u0097',
            replace: '&#151;',
        },
        {
            find: '\u0098',
            replace: '&#152;',
        },
        {
            find: '\u0099',
            replace: '&#153;',
        },
    ];
    toReplace.forEach((replace) => str = str.split(replace.find).join(replace.replace));
    return JSON.parse(str);
}

export default router;

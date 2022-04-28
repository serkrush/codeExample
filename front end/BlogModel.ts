import { fork, call, select } from 'redux-saga/effects';

import { RootState } from '../../app/constants';
import Model, { CRUD, saga } from './model';


export const ITEMS_PER_PAGE = 25;


class Blog extends Model {

    constructor() {
        super('blogs', { idAttribute: 'slug' });
    }

    @saga()
    public * fetchBlogs(data: any) {
        const func = this.request('/blog/posts', {method: 'GET'}).bind(this);
        const entities = yield select((state: RootState) => state.entities);
        const existItem = data.slug && Object.values(entities.blogs).find((u: any) => u.slug === String(data.slug));
        if (!existItem) {
            yield fork(func, data);
        }
    }

    @saga()
    public * loadBlogs(data: any) {
        const func = this.request('/blog/posts', {method: 'GET', crud: CRUD.READ}).bind(this);
        yield call(this.pageEntity, func, data);
    }

    @saga()
    public * fetchFeatured(data: any) {
        const func = this.request('/blog/featured', {method: 'GET', crud: CRUD.READ}).bind(this);
        yield fork(func, data);
    }
}

export default new Blog();

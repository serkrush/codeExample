import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import dynamic from 'next/dynamic';
import getConfig from 'next/config';
import Router, { withRouter } from 'next/router';

import { watcher } from '../app/models/model';
import { BLOG_PAGE, INextContext, RootState } from '../app/constants';
import Layout from '../app/components/Layout';
import BlogList from '../app/components/Blog/BlogList';
import BlogModel from '../app/models/blog';
import Page from '../app/models/page';
import Grade from '../app/models/grade';


const { publicRuntimeConfig : { BASE_URL } } = getConfig();
const MobileSubHead = dynamic(() => import('../app/components/Blog/MobileSubHead'));


interface IBlogProps {
    fetchBlogs: (data?: any) => void;
    loadBlogs: (data?: any) => void;
    fetchFeatured: (data?: any) => void;
    blogs: any;
    pager: any;
    router: any;
    featured: any;
    grades: any;
}

interface IBlogState {
    prevUrl: object;
    page: number;
}


@watcher(Grade, ['loadGrades'])
@watcher(Page, ['loadPageByName'])
@watcher(BlogModel, ['loadBlogs', 'fetchBlogs', 'fetchFeatured'])
class Blog extends React.Component<IBlogProps, IBlogState> {
    constructor(props: IBlogProps) {
        super(props);
        this.state = {
            prevUrl: {},
            page: 1,
        };
    }

    public static async getInitialProps(ctx: INextContext) {
        await ctx.store.execSagaTasks(ctx, (dispatch: Dispatch) => {
            dispatch(Page.actions.loadPageByName({name: BLOG_PAGE}));
            dispatch(BlogModel.actions.loadBlogs({
                pageName: 'blogsAll',
                page: ctx.query && ctx.query.page ? parseInt(ctx.query.page, 10) : 1,
            }));
            dispatch(BlogModel.actions.fetchFeatured());
            dispatch(Grade.actions.loadGrades());
        });
    }

    public setQuery = (q: any) => this.setState({prevUrl: q});

    public handleLoadMore = (page: number) => {
        this.setState({ page }, () => {
            const href = `/blog?page=${page}`;
            Router.replace(href, href, { shallow: true });
            this.props.loadBlogs({
                pageName: 'blogsAll',
                page: page == null ? this.state.page : page,
            });
        });

    }

    public handleSearch = (data: any) => this.props.fetchBlogs(data);

    public render() {
        const { pager, featured, router: { query: { page } }, grades, fetchBlogs } = this.props;
        const items = BlogModel.getPagerItems('blogsAll');
        const metaParams = [
            {name: 'og:locale', content: 'en_US'},
            {name: 'og:type', content: 'article'},
            {name: 'og:url', content: BASE_URL + '/blog/'}
        ];
        const metaConcat = [
            {name: 'title', content: page ? 'page-' + page : 'page-1'},
            {name: 'description', content: page ? 'page-' + page : 'page-1'},
            {name: 'keywords', content: page ? 'page-' + page : 'page-1'}
        ];

        return (
            <Layout pageName={BLOG_PAGE} metas={metaParams} metaConcat={metaConcat}>
                <React.Fragment>
                    <MobileSubHead
                        featured={featured}
                        grades={grades}
                        fetchBlogs={fetchBlogs}/>
                    <BlogList
                        pager={pager}
                        items={items}
                        grades={grades}
                        featured={featured}
                        handleLoadMore={this.handleLoadMore}
                        handleSearch={this.handleSearch}/>
                </React.Fragment>
            </Layout>
        );
    }
}

const mapStateToProps = (state: RootState, props: any) => {
    const { entities, pagination } = state;

    return {
        blogs: Object.values(entities.blogs),
        featured: Object.values(entities.blogs).filter((v: any) => v.featured === true),
        pager: pagination['blogsAll'],
        grades: Object.values(entities.grades)
    };
};

export default withRouter(connect(mapStateToProps, {...BlogModel.actions})(Blog));

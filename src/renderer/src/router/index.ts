import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '../components/Home.vue'
import New from '../components/New.vue'
import Edit from '../components/Edit.vue'
import Create from '../components/Create.vue'
import Check from '../components/Check.vue'
import Publish from '../components/Publish.vue'
import Site from '../components/Site.vue'
import Finish from '../components/Finish.vue'
import Login from '../components/Login.vue'
import Localtask from '../components/Localtask.vue'
import Quickstart from '../components/Quickstart.vue'

const router = createRouter(
    {
        routes:[
            {
                name: 'home',
                path: '/',
                component: Home
            },
            {
                name: 'new',
                path: '/new', 
                component: New
            },
            {
                name: 'edit',
                path: '/edit',
                component: Edit,
                children: [
                    {
                        name: 'create',
                        path: 'create/:id',
                        component: Create,
                        props: true
                    },
                    {
                        name: 'check',
                        path: 'check/:id',
                        component: Check,
                        props: true
                    },
                    {
                        name: 'publish',
                        path: 'publish/:id',
                        component: Publish,
                        props: true
                    },
                    {
                        name: 'site',
                        path: 'site/:id',
                        component: Site,
                        props: true
                    },
                    {
                        name: 'finish',
                        path: 'finish/:id',
                        component: Finish,
                        props: true
                    }
                ]
            },
            {
                name: 'login',
                path: '/login', 
                component: Login
            },
            {
                name: 'localtask',
                path: '/localtask', 
                component: Localtask
            },
            {
                name: 'quickstart',
                path: '/quickstart', 
                component: Quickstart
            },
        ],
        history:createWebHashHistory()
    }
)

export default router
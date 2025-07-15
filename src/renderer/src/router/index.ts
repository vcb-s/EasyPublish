import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '../components/Home.vue'
import CreateTask from '../components/CreateTask.vue'
import Task from '../components/Task.vue'
import Edit from '../components/Edit.vue'
import Check from '../components/Check.vue'
import BTPublish from '../components/BTPublish.vue'
import ForumPublish from '../components/ForumPublish.vue'
import Finish from '../components/Finish.vue'
import Account from '../components/Account.vue'
import TaskList from '../components/TaskList.vue'
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
                name: 'create_task',
                path: '/create_task', 
                component: CreateTask
            },
            {
                name: 'task',
                path: '/task',
                component: Task,
                children: [
                    {
                        name: 'edit',
                        path: 'edit/:id',
                        component: Edit,
                        props: true
                    },
                    {
                        name: 'check',
                        path: 'check/:id',
                        component: Check,
                        props: true
                    },
                    {
                        name: 'bt_publish',
                        path: 'bt_publish/:id',
                        component: BTPublish,
                        props: true
                    },
                    {
                        name: 'forum_publish',
                        path: 'forum_publish/:id',
                        component: ForumPublish,
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
                name: 'account',
                path: '/account', 
                component: Account
            },
            {
                name: 'task_list',
                path: '/task_list', 
                component: TaskList
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
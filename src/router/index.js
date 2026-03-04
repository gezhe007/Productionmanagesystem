import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home'
import Shelf from '@/views/Shelf'
import Warehouse from '@/views/Warehouse'
import Replenish from '@/views/Replenish'
import Category from '@/views/Category'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/shelf',
      name: 'Shelf',
      component: Shelf
    },
    {
      path: '/warehouse',
      name: 'Warehouse',
      component: Warehouse
    },
    {
      path: '/replenish',
      name: 'Replenish',
      component: Replenish
    },
    {
      path: '/category',
      name: 'Category',
      component: Category
    }
  ]
})
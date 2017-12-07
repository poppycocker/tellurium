import Vue from 'vue'
import Router from 'vue-router'
import DrawingConfig from '@/components/DrawingConfig'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: `/:mode`,
      component: DrawingConfig,
      props: true
    }
  ]
})

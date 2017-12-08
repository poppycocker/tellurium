import Tellurium from 'tellurium'
import Vue from 'vue'
import Router from 'vue-router'
import Auth from '@/components/Auth'
import Main from '@/components/Main'
import ViewState2d from '@/components/assistant/ViewState2d'
import ViewState3d from '@/components/assistant/ViewState3d'
import ConfigLineString from '@/components/assistant/drawingconfig/LineString'
import ConfigPolygonLike from '@/components/assistant/drawingconfig/PolygonLike'
import ConfigPoint from '@/components/assistant/drawingconfig/Point'
import FeaturePicker from '@/components/assistant/FeaturePicker'
import Measuring from '@/components/assistant/Measuring'
import Blank from '@/components/Blank'

const m = Tellurium.availableMode

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: `/auth`,
      component: Auth
    },
    {
      path: `/`,
      redirect: `/auth`,
      component: Main,
      children: [
        {
          path: `${m.VIEW_2DMAP}`,
          component: ViewState2d
        },
        {
          path: `${m.VIEW_3DMAP}`,
          component: ViewState3d
        },
        {
          path: `${m.PICK_FEATURE}`,
          component: FeaturePicker,
          props: true,
          children: [
            {
              path: '',
              component: Blank
            },
            {
              path: 'linestring',
              component: ConfigLineString
            },
            {
              path: 'polygon',
              component: ConfigPolygonLike
            },
            {
              path: 'circle',
              component: ConfigPolygonLike
            },
            {
              path: 'point',
              component: ConfigPoint
            }
          ]
        },
        {
          path: `${m.MEASURE_DISTANCE}`,
          component: Measuring
        },
        {
          path: `${m.GENERATE_ARC}`,
          component: Blank
        },
        {
          path: `${m.DRAW_POLYLINE}`,
          component: ConfigLineString,
          props: true
        },
        {
          path: `${m.DRAW_POLYLINE_FREEHAND}`,
          component: ConfigLineString,
          props: true
        },
        {
          path: `${m.DRAW_SQUARE}`,
          component: ConfigPolygonLike,
          props: true
        },
        {
          path: `${m.DRAW_RECTANGLE}`,
          component: ConfigPolygonLike,
          props: true
        },
        {
          path: `${m.DRAW_POLYGON}`,
          component: ConfigPolygonLike,
          props: true
        },
        {
          path: `${m.DRAW_CIRCLE}`,
          component: ConfigPolygonLike,
          props: true
        },
        {
          path: `${m.DRAW_ELLIPSE}`,
          component: ConfigPolygonLike,
          props: true
        },
        {
          path: `${m.DRAW_POINT}`,
          component: ConfigPoint,
          props: true
        }
      ]
    }
  ]
})

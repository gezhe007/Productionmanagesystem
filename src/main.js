import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import { Button, Input, Collapse, DatePicker, InputNumber, Dialog, Form, FormItem, Card, Alert, Row, Col, Empty, Tag, Select, Option, CollapseItem,Message } from 'element-ui'
Vue.component(Button.name, Button)
Vue.component(Input.name, Input)
Vue.component(Collapse.name, Collapse)
Vue.component(DatePicker.name, DatePicker)
Vue.component(InputNumber.name, InputNumber)
Vue.component(Dialog.name, Dialog)
Vue.component(Form.name, Form)
Vue.component(FormItem.name, FormItem)
Vue.component(Card.name, Card)
Vue.component(Alert.name, Alert)
Vue.component(Row.name, Row)
Vue.component(Col.name, Col)
Vue.component(Empty.name, Empty)
Vue.component(Tag.name, Tag)
Vue.component(Select.name, Select)
Vue.component(Option.name, Option)
Vue.component(CollapseItem.name, CollapseItem)
Vue.prototype.$message = Message

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

<template>
  <div>
    <section>
      <label for="username">user name:</label>
      <el-input id="username" v-model="username" v-on:keyup.enter="auth" :minlength="1" required />
      <label for="password">password:</label>
      <el-input type="password" id="password" v-model="password" v-on:keyup.enter="auth" :minlength="1" required />
      <el-button type="button" @click="auth">Authenticate</el-button>
    </section>
  </div>
</template>

<script>
// import axios from 'axios'
// import querystring from 'querystring'
import hub from '@/hub'

export default {
  data () {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    auth () {
      if (!this.username || !this.password) {
        hub.$emit('show_message', 'Username and Password required.')
        return
      }
      hub.$emit('authenticated', this.username, '!dummytoken!')
      // axios.post('/api/auth', querystring.stringify({
      //   name: this.username,
      //   password: this.password
      // })).then(res => {
      //   if (res.data.success) {
      //     hub.$emit('authenticated', res.data.token)
      //   } else {
      //     hub.$emit('show_message', res.data.message)
      //   }
      // }).catch(err => {
      //   hub.$emit('show_message', err.message)
      // })
    }
  }
}
</script>

<style scoped>
input {
  width: 80%;
  height: 1.5em;
  background: #eee;
  border: 1px solid #bebebe;
  font-size: 1em;
  text-indent: 0.7em;
}
input:focus {
  background: #edf4ff;
}
label {
  display: block;
  margin-top: 0.2em;
  font-size: 1.5em;
}
button {
  width: 80%;
  height: 1.8em;
  margin: 1.2em auto;
  font-size: 1.5em;
  background-color: #BC1142;
  color: white;
}
</style>
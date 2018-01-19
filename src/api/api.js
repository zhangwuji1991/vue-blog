import axios from 'axios'
import qs from 'qs'

let base = 'http://localhost:8888/vue'
let heads = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
export const getbzs = params => { return axios.post(`${base}/bzdata`, qs.stringify(params), heads).then(res => res.data) }

import axios from 'axios'

const BASE = '/api/v1/push-tasks'

export async function createTask(data) {
  const res = await axios.post(BASE, data)
  return res.data
}

export async function updateTask(taskId, data) {
  const res = await axios.put(`${BASE}/${taskId}`, data)
  return res.data
}

export async function getTask(taskId) {
  const res = await axios.get(`${BASE}/${taskId}`)
  return res.data
}

export async function listTasks(params) {
  const res = await axios.get(BASE, { params })
  return res.data
}

export async function deleteTask(taskId) {
  const res = await axios.delete(`${BASE}/${taskId}`)
  return res.data
}

export async function estimateUsers(params) {
  const res = await axios.post(`${BASE}/estimate`, params)
  return res.data
}

export async function getTopics() {
  const res = await axios.get(`${BASE}/topics`)
  return res.data
}

export async function getEvents() {
  const res = await axios.get(`${BASE}/events`)
  return res.data
}

export async function getTemplates() {
  const res = await axios.get(`${BASE}/templates`)
  return res.data
}

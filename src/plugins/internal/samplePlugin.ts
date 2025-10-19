import { Plugin } from '../../types/index.js'

const plugin: Plugin = {
  name: 'sample',
  actions: {
    echo: async (payload) => payload,
    time: () => new Date().toISOString()
  }
}

export default plugin

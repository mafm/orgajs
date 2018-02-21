import Node from '../node'
import { parse as inlineParse } from '../inline'

function parsePlanning() {
  const token = this.next()
  if (!token || token.name != `planning`) { return undefined }
  return new Node('planning').with(token.data)
}

function parseDrawer() {
  const begin = this.next()
  var lines = []
  while (this.hasNext()) {
    const t = this.next()
    if ( t.name === `headline` ) { return undefined }
    if (t.name === `drawer.end` ) {
      return new Node('drawer').with({ name: begin.data.type, value: lines.join(`\n`) })
    }
    lines.push(t.raw)
  }
  return undefined
}

function process(token, section) {
  const { level, keyword, priority, tags, content } = token.data
  const currentLevel = section.level || 0
  if (level <= currentLevel) { return section }
  this.consume()
  const text = inlineParse(content)
  var headline = new Node('headline', text).with({
    level, keyword, priority, tags
  })
  const planning = this.tryTo(parsePlanning)
  if (planning) {
    headline.push(planning)
  }

  while (this.hasNext() && this.peek().name == `drawer.begin`) {
    let drawer = this.tryTo(parseDrawer)
    if (!drawer) { // broken drawer
      this.downgradeToLine(this.cursor + 1)
      break
    }
    headline.push(drawer)
  }
  const newSection = new Node(`section`).with({ level })
  newSection.push(headline)
  section.push(this.parseSection(this.unagi(newSection)))
  this._aks = {}
  return this.parseSection(section)
}

module.exports = process

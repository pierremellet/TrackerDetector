export type Domain = {
  id: number,
  name: string,
  enable: boolean
}

export type DisablableItem = {
  enable: boolean
}

export type CookieCategories = {
  id: number,
  name: string
} & DisablableItem

export type PixelTemplate = {
  id?: number,
  uri: string,
  type: string
}
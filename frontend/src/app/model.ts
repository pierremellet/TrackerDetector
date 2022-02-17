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
  name: string,
  duration: number
} & DisablableItem

export type PixelTemplate = {
  id?: number,
  uri: string,
  type: string
}

export type ApplicationVersion = {
  id: number,
  name: string
}
import { CffDict, defineCffDictProp } from './CffDict'

export class CffPrivateDict extends CffDict {
  @defineCffDictProp(19) declare subrs: number
  @defineCffDictProp(20) declare defaultWidthX: number
  @defineCffDictProp(21) declare nominalWidthX: number
}

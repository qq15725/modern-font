import { CffDict, defineCffDictProp } from './CffDict'

export class CffTopDict extends CffDict {
  @defineCffDictProp(0, 'string') declare version: string
  @defineCffDictProp(1, 'string') declare notice: string
  @defineCffDictProp(1200, 'string') declare copyright: string
  @defineCffDictProp(2, 'string') declare fullName: string
  @defineCffDictProp(3, 'string') declare familyName: string
  @defineCffDictProp(4, 'string') declare weight: string
  @defineCffDictProp(1201) declare isFixedPitch: number
  @defineCffDictProp(1202) declare italicAngle: number
  @defineCffDictProp(1203, 'number', -100) declare underlinePosition: number
  @defineCffDictProp(1204, 'number', 50) declare underlineThickness: number
  @defineCffDictProp(1205) declare paintType: number
  @defineCffDictProp(1206, 'number', 2) declare charstringType: number
  @defineCffDictProp(1207, 'number[]', [0.001, 0, 0, 0.001, 0, 0]) declare fontMatrix: number[]
  @defineCffDictProp(13) declare uniqueId: number
  @defineCffDictProp(5, 'number[]', [0, 0, 0, 0]) declare fontBBox: number[]
  @defineCffDictProp(1208) declare strokeWidth: number
  @defineCffDictProp(14) declare xuid: number
  @defineCffDictProp(15) declare charset: number
  @defineCffDictProp(16) declare encoding: number
  @defineCffDictProp(17) declare charStrings: number
  @defineCffDictProp(18, 'number[]', [0, 0]) declare private: number[]
}

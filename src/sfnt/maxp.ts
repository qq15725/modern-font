import { Entity } from '../utils'
import { Sfnt } from './sfnt'

declare module './sfnt' {
  interface Sfnt {
    maxp: Maxp
  }
}

// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6maxp.html
@Sfnt.table('maxp')
export class Maxp extends Entity {
  @Entity.column({ type: 'fixed' }) declare version: number
  @Entity.column({ type: 'uint16' }) declare numGlyphs: number
  @Entity.column({ type: 'uint16' }) declare maxPoints: number
  @Entity.column({ type: 'uint16' }) declare maxContours: number
  @Entity.column({ type: 'uint16' }) declare maxComponentPoints: number
  @Entity.column({ type: 'uint16' }) declare maxComponentContours: number
  @Entity.column({ type: 'uint16' }) declare maxZones: number
  @Entity.column({ type: 'uint16' }) declare maxTwilightPoints: number
  @Entity.column({ type: 'uint16' }) declare maxStorage: number
  @Entity.column({ type: 'uint16' }) declare maxFunctionDefs: number
  @Entity.column({ type: 'uint16' }) declare maxInstructionDefs: number
  @Entity.column({ type: 'uint16' }) declare maxStackElements: number
  @Entity.column({ type: 'uint16' }) declare maxSizeOfInstructions: number
  @Entity.column({ type: 'uint16' }) declare maxComponentElements: number
  @Entity.column({ type: 'uint16' }) declare maxComponentDepth: number
}

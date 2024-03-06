import { Entity } from '../utils'

export class TableDirectory extends Entity {
  @Entity.column({ type: 'char', size: 4 }) declare tag: string
  @Entity.column({ type: 'uint32' }) declare checkSum: number
  @Entity.column({ type: 'uint32' }) declare offset: number
  @Entity.column({ type: 'uint32' }) declare length: number
}

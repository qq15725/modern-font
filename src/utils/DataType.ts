export type DataType =
  | 'int8'
  | 'int16'
  | 'int32'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'float32'
  | 'float64'
  | 'fixed'
  | 'longDateTime'
  | 'char'

export const dataTypeToByteLength: Record<DataType, number> = {
  int8: 1,
  int16: 2,
  int32: 4,
  uint8: 1,
  uint16: 2,
  uint32: 4,
  float32: 4,
  float64: 8,
  fixed: 4,
  longDateTime: 8,
  char: 1,
}

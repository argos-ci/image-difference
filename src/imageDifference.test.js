import { extractDifference } from './imageDifference'

describe('extractDifference', () => {
  describe('An image-difference output with no difference', () => {
    it('extracts no difference', () => {
      const difference = extractDifference('all: 0 (0)', {
        metric: 'RMSE',
      })
      expect(difference.value1).toBe(0)
      expect(difference.value2).toBe(0)
    })
  })

  describe('An image-difference output with a significant difference', () => {
    it('extracts the significant difference', () => {
      const difference = extractDifference('all: 40131.8 (0.612372)', {
        metric: 'RMSE',
      })
      expect(difference.value1).toBe(40131.8)
      expect(difference.value2).toBe(0.612372)
    })
  })

  describe('An image-difference output with a fractional difference', () => {
    it('extracts the fractional difference', () => {
      const difference = extractDifference('all: 0.460961 (7.03381e-06)', {
        metric: 'RMSE',
      })
      expect(difference.value1).toBe(0.460961)
      expect(difference.value2).toBe(7.03381e-6)
    })
  })

  describe('An image-difference output with a super fractional difference', () => {
    it('extracts the fractional difference', () => {
      const difference = extractDifference('all: 7.03381e-06 (7.03381e-06)', {
        metric: 'RMSE',
      })
      expect(difference.value1).toBe(7.03381e-6)
      expect(difference.value2).toBe(7.03381e-6)
    })
  })
})

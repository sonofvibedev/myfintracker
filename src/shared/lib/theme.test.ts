import { renderHook, act } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useTheme } from './theme'

test('theme cycles system -> light -> dark and persists', () => {
  const { result } = renderHook(() => useTheme())

  expect(result.current.theme).toBe('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()

  act(() => result.current.toggleTheme())
  expect(result.current.theme).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')

  act(() => result.current.toggleTheme())
  expect(result.current.theme).toBe('dark')

  act(() => result.current.toggleTheme())
  expect(result.current.theme).toBe('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()

  expect(JSON.parse(localStorage.getItem('mft.appearance')!).theme).toBe('system')
})

test('palette is applied to the root element', () => {
  const { result } = renderHook(() => useTheme())

  act(() => result.current.setPalette('forest'))
  expect(document.documentElement.dataset.palette).toBe('forest')

  act(() => result.current.setPalette('indigo'))
  expect(document.documentElement.dataset.palette).toBe('indigo')
})

/** Transient npm publish failures and the retry backoff they select. */

import { describe, expect, it } from 'vitest'
import {
  PUBLISH_SPACING_MS,
  RATE_LIMIT_ATTEMPTS,
  RATE_LIMIT_BACKOFF_MS,
  existingPublishedVersionAction,
  isRateLimited,
  isTransientFailure,
  retryBackoffMs,
} from './publish.ts'

const packumentRace = 'npm error code E409\nnpm error Failed to save packument'
const rateLimited = [
  'npm error code E429',
  'npm error 429 Too Many Requests - PUT https://registry.npmjs.org/@x1a0f3n9%2fdsh-command-goal',
  'Could not publish, as user undefined: rate limited exceeded',
].join('\n')
const rejected = 'npm error code E403\nnpm error You cannot publish over an existing version'

describe('release publish retries', () => {
  it('retries packument races and rate limits, and refuses a rejected payload', () => {
    expect(isTransientFailure(packumentRace)).toBe(true)
    expect(isTransientFailure(rateLimited)).toBe(true)
    expect(isTransientFailure(rejected)).toBe(false)
    expect(isRateLimited(rateLimited)).toBe(true)
    expect(isRateLimited(packumentRace)).toBe(false)
  })

  it('backs off packument races from the publish spacing', () => {
    expect(retryBackoffMs(packumentRace, 1)).toBe(PUBLISH_SPACING_MS)
    expect(retryBackoffMs(packumentRace, 2)).toBe(PUBLISH_SPACING_MS * 2)
    expect(retryBackoffMs(packumentRace, 3)).toBe(PUBLISH_SPACING_MS * 4)
  })

  it('backs off a rate-limit blip once, then the job must fail', () => {
    expect(RATE_LIMIT_ATTEMPTS).toBe(2)
    expect(retryBackoffMs(rateLimited, 1)).toBe(RATE_LIMIT_BACKOFF_MS)
    expect(retryBackoffMs(rateLimited, 2)).toBe(RATE_LIMIT_BACKOFF_MS * 2)
    expect(RATE_LIMIT_BACKOFF_MS).toBe(2_000)
  })
})

describe('release publish existing versions', () => {
  it('skips an identical tarball', () => {
    expect(existingPublishedVersionAction('sha512-a', 'sha512-a', '')).toBe('skip')
    expect(existingPublishedVersionAction('sha512-a', 'sha512-a', 'refs/heads/dev-x1a0f3n9')).toBe('skip')
  })

  it('fails a tagged mismatch and skips a branch-publish mismatch', () => {
    expect(existingPublishedVersionAction('sha512-a', 'sha512-b', '')).toBe('fail')
    expect(existingPublishedVersionAction('sha512-a', 'sha512-b', 'refs/heads/dev-x1a0f3n9')).toBe('skip')
  })
})

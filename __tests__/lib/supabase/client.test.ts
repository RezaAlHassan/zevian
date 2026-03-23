import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createClient } from '../../../src/lib/supabase/client';

describe('Supabase createClient', () => {
  let originalUrl: string | undefined;
  let originalKey: string | undefined;

  beforeEach(() => {
    // Save original env vars
    originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    // Restore original env vars
    if (originalUrl !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }

    if (originalKey !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  });

  it('should create a Supabase browser client successfully', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';

    const client = createClient();

    // The client should be an object (SupabaseClient instance)
    assert.strictEqual(typeof client, 'object');
    assert.ok(client !== null, 'Client should not be null');
  });

  it('should throw an error if environment variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    assert.throws(
      () => {
        createClient();
      },
      /Your project's URL and Key are required to create a Supabase client/i,
      'Should throw an error about missing URL and Key'
    );
  });
});

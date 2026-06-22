import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';
import type { UserRole } from '../src/modules/profiles/profiles.types';

const TEST_UUID = '11111111-1111-4111-8111-111111111111';

/**
 * Stub SupabaseService so the real SupabaseAuthGuard + RolesGuard run against a
 * role encoded in the bearer token (`Authorization: Bearer <role>`). This keeps
 * the test hermetic — no network calls — while exercising the actual guard
 * pipeline that enforces role boundaries.
 */
const supabaseStub = {
  getUserFromToken: (token: string) =>
    Promise.resolve(token ? { id: token, email: `${token}@test.local` } : null),
  getAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: (_column: string, value: string) => ({
          single: () => Promise.resolve({ data: { role: value }, error: null }),
        }),
      }),
    }),
  }),
} as unknown as SupabaseService;

type Method = 'get' | 'post' | 'patch';

interface BoundaryCase {
  description: string;
  method: Method;
  path: string;
  role: UserRole;
}

const FORBIDDEN_CASES: BoundaryCase[] = [
  {
    description: 'household cannot create an order (industry only)',
    method: 'post',
    path: '/orders',
    role: 'household',
  },
  {
    description: 'household cannot create a material batch (collector only)',
    method: 'post',
    path: '/collector/material-batches',
    role: 'household',
  },
  {
    description: 'household cannot read collector available waste',
    method: 'get',
    path: '/collector/available-waste',
    role: 'household',
  },
  {
    description: 'household cannot read the collector pickup map',
    method: 'get',
    path: '/collector/pickup-map-data',
    role: 'household',
  },
  {
    description: 'household cannot preview a route (collector only)',
    method: 'post',
    path: '/routes/preview',
    role: 'household',
  },
  {
    description: 'household cannot publish a batch to the market',
    method: 'post',
    path: `/materials/${TEST_UUID}/publish-to-market`,
    role: 'household',
  },
  {
    description: 'industry cannot create a waste listing (household only)',
    method: 'post',
    path: '/waste-listings',
    role: 'industry',
  },
  {
    description: 'industry cannot create a pickup claim (collector only)',
    method: 'post',
    path: '/collector/pickup-claims',
    role: 'industry',
  },
  {
    description: 'industry cannot commit a route (collector only)',
    method: 'post',
    path: '/routes',
    role: 'industry',
  },
  {
    description: 'industry cannot list collector material batches',
    method: 'get',
    path: '/collector/material-batches',
    role: 'industry',
  },
  {
    description: 'collector cannot create an order (industry only)',
    method: 'post',
    path: '/orders',
    role: 'collector',
  },
  {
    description: 'collector cannot create a waste listing (household only)',
    method: 'post',
    path: '/waste-listings',
    role: 'collector',
  },
  {
    description:
      'household cannot read a negotiation (industry/collector only)',
    method: 'get',
    path: `/negotiations/${TEST_UUID}`,
    role: 'household',
  },
  {
    description: 'industry cannot update a market listing (collector only)',
    method: 'patch',
    path: `/materials/market/${TEST_UUID}`,
    role: 'industry',
  },
];

describe('Role boundary enforcement (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseStub)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(FORBIDDEN_CASES)(
    'returns 403 INSUFFICIENT_ROLE: $description',
    async ({ method, path, role }) => {
      const response = await request(app.getHttpServer())
        [method](path)
        .set('Authorization', `Bearer ${role}`)
        .send({});

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        code: 'INSUFFICIENT_ROLE',
      });
    },
  );

  it('returns 401 AUTH_REQUIRED when no bearer token is presented', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      code: 'AUTH_REQUIRED',
    });
  });
});

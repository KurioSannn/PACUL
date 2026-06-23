
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RouteService } from './src/modules/routes/route.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const routeService = app.get(RouteService);
  try {
    await routeService.updateRouteStatus('f42100ac-9bc7-467b-adad-3b3514520949', 'd1000003-0001-4000-8000-000000000003', 'ongoing');
    console.log('SUCCESS ONGOING');
    await routeService.updateRouteStatus('f42100ac-9bc7-467b-adad-3b3514520949', 'd1000003-0001-4000-8000-000000000003', 'completed');
    console.log('SUCCESS COMPLETED');
  } catch (err) {
    console.error('ERROR OCCURRED:');
    console.error(err);
  }
  await app.close();
}
run();


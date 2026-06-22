import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PACUL_CAPABILITIES } from '../../common/config/capabilities';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('roles')
export class AuthController {
  @Public()
  @Get('capabilities')
  @ApiOperation({ summary: 'Get RBAC capabilities map for all roles' })
  getCapabilities() {
    return PACUL_CAPABILITIES;
  }
}

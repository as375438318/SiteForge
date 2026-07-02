import { Module } from '@nestjs/common'
import { FormsController } from './forms.controller'
import { FormsService } from './forms.service'
import { LeadsController } from './leads.controller'
import { LeadsService } from './leads.service'

@Module({
  controllers: [FormsController, LeadsController],
  providers: [FormsService, LeadsService],
})
export class FormsModule {}

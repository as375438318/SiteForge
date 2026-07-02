import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { LeadsService } from './leads.service'

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get(':siteId')
  list(@Param('siteId') siteId: string, @Query('formId') formId?: string, @Query('status') status?: string) {
    return this.leads.listLeads(siteId, { formId, status })
  }
  @Get('detail/:id')
  get(@Param('id') id: string) { return this.leads.getLead(id) }
  @Post()
  create(@Body() body: any) { return this.leads.createLead(body) }
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) { return this.leads.updateLeadStatus(id, status) }
  @Delete(':id')
  delete(@Param('id') id: string) { return this.leads.deleteLead(id) }
  @Get(':siteId/export')
  export(@Param('siteId') siteId: string) { return this.leads.exportLeads(siteId) }
}

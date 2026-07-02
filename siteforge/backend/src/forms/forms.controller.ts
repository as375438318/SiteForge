import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { FormsService } from './forms.service'

@Controller('api/forms')
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Get(':siteId')
  list(@Param('siteId') siteId: string) { return this.forms.listForms(siteId) }
  @Get('detail/:id')
  get(@Param('id') id: string) { return this.forms.getForm(id) }
  @Post()
  create(@Body() body: any) { return this.forms.createForm(body) }
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.forms.updateForm(id, body) }
  @Delete(':id')
  delete(@Param('id') id: string) { return this.forms.deleteForm(id) }
}

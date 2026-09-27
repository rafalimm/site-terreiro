import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asaasWebhookToken } from '../services/asaas';

const router=Router();
router.post('/webhooks/asaas',async(req,res)=>{
  const expected=asaasWebhookToken();
  const received=String(req.header('asaas-access-token')||'');
  if(!expected||received!==expected) return res.status(401).json({error:'Webhook não autorizado.'});
  const body=req.body??{}, eventId=String(body.id||''), event=String(body.event||''), paymentId=String(body.payment?.id||'');
  if(!eventId) return res.status(400).json({error:'Evento sem identificador.'});
  try{await prisma.asaasWebhookEvent.create({data:{id:eventId,event,receivedAt:new Date().toISOString()}});}
  catch{return res.status(200).json({received:true,duplicate:true});}
  try{
    if(paymentId){
      const local=await prisma.membershipPayment.findFirst({where:{transactionId:paymentId}});
      if(local){
        const status=event==='PAYMENT_RECEIVED'?'paid':event==='PAYMENT_OVERDUE'?'overdue':event==='PAYMENT_DELETED'||event==='PAYMENT_REFUNDED'?'canceled':null;
        if(status) await prisma.membershipPayment.update({where:{id:local.id},data:{status,paidAt:status==='paid'?new Date().toISOString():local.paidAt,updatedAt:new Date().toISOString()}});
      }
    }
    await prisma.asaasWebhookEvent.update({where:{id:eventId},data:{processedAt:new Date().toISOString()}});
    return res.status(200).json({received:true});
  }catch(error){console.error('Erro ao processar webhook Asaas:',error);return res.status(200).json({received:true,processed:false});}
});
export default router;

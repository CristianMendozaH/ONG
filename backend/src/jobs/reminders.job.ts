import { Op } from 'sequelize';
import { Maintenance } from '../models/Maintenance.js';
import { Equipment } from '../models/Equipment.js';
//import { sendMail } from '../utils/mailer';

const iso = (d: Date | string) => new Date(d).toISOString().slice(0,10);

// próximos mantenimientos (programado)
async function maintDueSoon(days = 3) {
  const today = new Date();
  const to = new Date(); to.setDate(today.getDate() + days);

  const items = await Maintenance.findAll({
    where: { status: 'programado', scheduledDate: { [Op.between]: [iso(today), iso(to)] } },
    include: [{ model: Equipment, as: 'equipment', attributes: ['code','name'] }]
  });

  for (const m of items) {
    const plain = m.get({ plain: true }) as any;
    const toEmail = process.env.ADMIN_EMAIL; // si no tienes email del técnico
    if (!toEmail) continue;
    const html = `
      <p>Recordatorio de mantenimiento ${plain.type} (${plain.priority}).</p>
      <p>Equipo: <b>${plain.equipment?.code} - ${plain.equipment?.name}</b></p>
      <p>Técnico: ${plain.technician || '—'}</p>
      <p>Programado para: <b>${plain.scheduledDate}</b></p>`;
    //await sendMail({ to: toEmail, subject: 'Mantenimiento próximo', html });
  }
}

// mantenimientos programados vencidos (no completados)
async function maintOverdue() {
  const today = new Date();

  const items = await Maintenance.findAll({
    where: { status: 'programado', scheduledDate: { [Op.lt]: iso(today) } },
    include: [{ model: Equipment, as: 'equipment', attributes: ['code','name'] }]
  });

  for (const m of items) {
    const plain = m.get({ plain: true }) as any;
    const toEmail = process.env.ADMIN_EMAIL;
    if (!toEmail) continue;
    const html = `
      <p><b>ATENCIÓN:</b> mantenimiento vencido.</p>
      <p>Equipo: <b>${plain.equipment?.code} - ${plain.equipment?.name}</b></p>
      <p>Técnico: ${plain.technician || '—'}</p>
      <p>Programado para: <b>${plain.scheduledDate}</b> (no completado)</p>`;
   // await sendMail({ to: toEmail, subject: 'Mantenimiento vencido', html });
  }
}

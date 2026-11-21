// =============================================================================
// NestJS + BullMQ 任務排程與三維防衝突服務參考實作 (對應 code_artifact.md 第 4, 6 節)
// =============================================================================

export interface AppointmentPayload {
  id: string;
  appointment_no: string;
  member_id: string;
  staff_id: string;
  treatment_id: string;
  room_id: string;
  machine_id?: string | null;
  start_time: string;
  end_time: string;
}

export interface NotificationQueueJob {
  id: string;
  jobName:
    | 'SEND_BOOKING_CONFIRMED'
    | 'SEND_PRE_TREATMENT_REMINDER'
    | 'SEND_POST_TREATMENT_CARE_DAY3'
    | 'SEND_MAINTENANCE_REMINDER_DAY21'
    | 'SEND_WAITLIST_RELEASE_ALERT';
  appointmentId: string;
  memberId: string;
  scheduledAt: string;
  delayMs: number;
  status: 'COMPLETED' | 'DELAYED' | 'ACTIVE' | 'CANCELLED';
}

/**
 * AppointmentSchedulerService
 * 負責預約成立後的 4 階段 LINE 生命週期自動化關懷排程與取消回收
 */
export class AppointmentSchedulerService {
  constructor(private readonly notificationQueue: { add: Function; getJob: Function }) {}

  async scheduleAppointmentNotifications(appointment: AppointmentPayload) {
    const startTime = new Date(appointment.start_time).getTime();
    const now = Date.now();

    // 任務 A: 立即發送 [預約成功通知] -> LINE Push API
    await this.notificationQueue.add(
      'SEND_BOOKING_CONFIRMED',
      { appointmentId: appointment.id, memberId: appointment.member_id },
      { delay: 0, jobId: `confirm-${appointment.id}` }
    );

    // 任務 B: 預約前 24 小時 [防爽約提醒 + 確認按鈕] (Delay Job)
    const reminderDelay = Math.max(0, startTime - 24 * 60 * 60 * 1000 - now);
    await this.notificationQueue.add(
      'SEND_PRE_TREATMENT_REMINDER',
      { appointmentId: appointment.id, memberId: appointment.member_id },
      { delay: reminderDelay, jobId: `pre-remind-${appointment.id}` }
    );

    // 任務 C: 術後第 3 天 [修復關懷 + 滿意度調查問卷] (Delay Job)
    const postCareDelay = Math.max(0, startTime + 3 * 24 * 60 * 60 * 1000 - now);
    await this.notificationQueue.add(
      'SEND_POST_TREATMENT_CARE_DAY3',
      { appointmentId: appointment.id, memberId: appointment.member_id },
      { delay: postCareDelay, jobId: `post-care-${appointment.id}` }
    );

    // 任務 D: 術後第 21 天 [膠原蛋白最佳維持期 - 療程維護提醒] (Delay Job)
    const maintenanceDelay = Math.max(0, startTime + 21 * 24 * 60 * 60 * 1000 - now);
    await this.notificationQueue.add(
      'SEND_MAINTENANCE_REMINDER_DAY21',
      { appointmentId: appointment.id, memberId: appointment.member_id },
      { delay: maintenanceDelay, jobId: `maint-21d-${appointment.id}` }
    );
  }

  async cancelScheduledNotifications(appointmentId: string) {
    const jobIds = [
      `pre-remind-${appointmentId}`,
      `post-care-${appointmentId}`,
      `maint-21d-${appointmentId}`,
    ];
    for (const id of jobIds) {
      const job = await this.notificationQueue.getJob(id);
      if (job) await job.remove();
    }
  }
}


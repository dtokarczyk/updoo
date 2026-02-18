-- Add INVITATION_PENDING to JobStatus (draft from invitation offer, awaiting invitee response)
ALTER TYPE "JobStatus" ADD VALUE 'INVITATION_PENDING';

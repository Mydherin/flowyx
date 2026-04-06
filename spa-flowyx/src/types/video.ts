export interface Video {
  id: string
  userId: string
  description: string
  tags: string[]
  videoUrl: string
  thumbnailUrl: string | null
  fileSizeBytes: number
  contentType: string
  status: 'PROCESSING' | 'READY' | 'FAILED'
  createdAt: string
  updatedAt: string
  sharedWithCount: number
  isOwner: boolean
  sharedByUserId: string | null
  sharedByNickname: string | null
  sharedByPictureUrl: string | null
  isNew: boolean
}

export interface VideoShare {
  userId: string
  nickname: string
  email: string
  pictureUrl: string | null
  sharedAt: string
}

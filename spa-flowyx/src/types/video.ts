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
}

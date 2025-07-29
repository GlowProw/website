/**
 * 配装
 */

export interface AssemblyBasieIds {
    id: string | bigint
    uuid: string
}

export interface AssemblyItem extends AssemblyBasieIds {
    name: number
    likes: number
    isLiked: boolean
    byUsername: string
    byUserId: string | number
}

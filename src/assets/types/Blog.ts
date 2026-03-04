interface Data {
    content: any
    filePath?: string
    hide_table_of_contents?: boolean
    parse_number_prefixes?: boolean
    slug?: string
    title: string
}

export interface BlogLatestPostData extends Data {}

export interface VersionLatestPostData extends Data {}

export interface BlogData {
    latestPosts?: BlogLatestPostData[]
    totalCount?: number
}

export interface VersionData {
    latestPosts?: VersionLatestPostData[]
    totalCount?: number
}

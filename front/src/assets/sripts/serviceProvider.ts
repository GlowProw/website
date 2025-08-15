interface ServiceProviderItem {
    name: string,
    src: string
}

export class ServiceProvider {
    private static list: ServiceProviderItem[] = [
        {
            name: 'edgeone',
            icon: 'edgeone.png',
            src: 'https://edgeone.ai'
        },
        {
            name: 'cloudflare',
            icon: 'cloudflare.svg',
            src: 'https://cloudflare.com'
        },
        {
            name: 'cloudflare_pages',
            icon: 'cloudflare_pages.svg',
            src: 'https://pages.cloudflare.com'
        },
        {
            name: 'crowdin',
            icon: 'crowdin.svg',
            src: 'https://crowdin.com'
        },
    ]

    get services() {
        return ServiceProvider.list.map(i => {
            return {...i}
        })
    }
}

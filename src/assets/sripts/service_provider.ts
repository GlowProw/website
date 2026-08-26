interface ServiceProviderItem {
    name: string,
    icon: string,
    src: string
}

export class Service_provider {
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
            icon: 'crowdin.png',
            src: 'https://crowdin.com/?utm_term=click-badge-add-on'
        },
        {
            name: 'datadoghq',
            icon: 'datadoghq.png',
            src: 'https://www.datadoghq.com'
        },
    ]

    get services() {
        return Service_provider.list.map(i => {
            return {...i}
        })
    }
}

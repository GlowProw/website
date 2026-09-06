export type ServiceProviderType = 'openSource' | 'techSupport'

export interface ServiceProviderItem {
    type: ServiceProviderType | string
    name: string,
    icon: string,
    src: string
}

export class Service_provider {
    private static list: ServiceProviderItem[] = [
        {
            type: 'openSource',
            name: 'edgeone',
            icon: 'edgeone.png',
            src: 'https://edgeone.ai'
        },
        {
            type: 'openSource',
            name: 'cloudflare',
            icon: 'cloudflare.svg',
            src: 'https://cloudflare.com'
        },
        {
            type: 'openSource',
            name: 'cloudflare_pages',
            icon: 'cloudflare_pages.svg',
            src: 'https://pages.cloudflare.com'
        },
        {
            type: 'openSource',
            name: 'crowdin',
            icon: 'crowdin.png',
            src: 'https://crowdin.com/?utm_term=click-badge-add-on'
        },
        {
            type: 'openSource',
            name: 'datadoghq',
            icon: 'datadoghq.png',
            src: 'https://www.datadoghq.com'
        },
        {
            type: 'techSupport',
            name: 'ubisoft',
            icon: 'ubisoft.svg',
            src: 'https://www.ubisoft.com/en-us/company/careers/locations/singapore'
        },
    ]

    get services() {
        return Service_provider.list.map(i => {
            return {...i}
        })
    }
}

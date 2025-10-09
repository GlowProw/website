export default class AppFuns {
    public list = [
        {
            title: 'header.functions.team.title',
            icon: 'mdi-bullhorn-outline',
            description: "header.functions.team.description",
            to: '/team'
        },
        {
            title: 'header.functions.calendar.title',
            icon: 'mdi-calendar-range',
            description: 'header.functions.calendar.description',
            to: '/calendar'
        },
        {
            title: 'header.functions.maps.title',
            icon: 'mdi-map',
            description: 'header.functions.maps.description',
            to: '/maps'
        },
        {
            title: 'header.functions.display-cabinet.title',
            icon: 'mdi-package-variant-closed',
            description: 'header.functions.display-cabinet.description',
            to: '/display-cabinet'
        },
        {
            title: 'header.functions.assembly.title',
            icon: 'mdi-palette-outline',
            description: 'header.functions.assembly.description',
            to: `/assembly/browse?t=${new Date().getTime()}`
        },
        {
            title: 'header.functions.captain-signature.title',
            icon: 'mdi-draw-pen',
            description: 'header.functions.captain-signature.description',
            to: ''
        },
        {
            title: 'header.functions.ranking-of-designed-items.title',
            icon: 'mdi-help',
            description: 'header.functions.ranking-of-designed-items.description',
            to: '/ranking-designed-items'
        },
        {
            title: 'header.functions.impression-of-monsters.title',
            icon: 'mdi-help',
            description: 'header.functions.impression-of-monsters.description',
            to: ''
        },
        {
            title: 'header.functions.fashion-show.title',
            icon: 'mdi-help',
            description: 'header.functions.fashion-show.description',
            to: ''
        },
        {
            title: 'header.functions.empire-skill-simulation.title',
            icon: 'mdi-help',
            description: 'header.functions.empire-skill-simulation.description',
            to: '/empire-skill-simulation'
        }
    ]
}

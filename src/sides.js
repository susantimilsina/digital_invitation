// Per-side content. Anu's and Susan's families host separate events, so each
// side has its own date/time/venue, countdown target, calendar event, and
// card artwork.

export const sides = {
  anu: {
    id: 'anu',
    cardImage: '/invitation.jpg',
    doorNames: 'Anu & Susan',
    seal: 'A&S',
    hostLine: 'With love, from Anu’s family',
    ariaName: 'Wedding invitation of Anu and Susan',
    calendarTitle: 'Anu & Susan’s Wedding',
    pageTitle: 'Anu & Susan · 25 November 2026',
    ceremonyTime: '3:00 PM',
    ceremonyDate: '25 November 2026',
    venueName: 'New Everest Party Palace, Madhyapur Thimi',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('New Everest Party Palace, Madhyapur Thimi'),
    calendarDetails:
      'Together with their families, Anu and Susan invite you to celebrate with them.',
    targetISO: '2026-11-25T15:00:00+05:45',
    calendarStart: '20261125T091500Z',
    calendarEnd: '20261125T141500Z',
  },

  susan: {
    id: 'susan',
    cardImage: '/invitation-susan.jpg',
    doorNames: 'Susan & Anu',
    seal: 'S&A',
    hostLine: 'With love, from Susan’s family',
    ariaName: 'Wedding invitation of Susan and Anu',
    calendarTitle: 'Susan & Anu’s Wedding',
    pageTitle: 'Susan & Anu · 28 November 2026',
    ceremonyTime: '4:30 PM',
    ceremonyDate: '28 November 2026',
    venueName: 'Khwopa Banquet, Bhaktapur',
    mapsUrl: 'https://maps.app.goo.gl/P3Vw99YP46hshmma8',
    calendarDetails:
      'Together with their families, Susan and Anu invite you to celebrate with them.',
    targetISO: '2026-11-28T16:30:00+05:45',
    calendarStart: '20261128T104500Z',
    calendarEnd: '20261128T154500Z',
  },
}

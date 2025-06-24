import { createUnifiedExtension } from '@vsf-enterprise/unified-api-sapcc';
import { b2bCoreOverrideMethods } from '@sf-modules-middleware/sap-b2b';
import { b2bCheckoutOverrideMethods, normalizerCustomFields } from '@sf-modules-middleware/checkout-b2b';

const {
  SAPCC_MEDIA_HOST
} = process.env;

export const unifiedApiExtension = createUnifiedExtension({
  config: {
    currencies: ['USD', 'EUR', 'GBP'],
    defaultCurrency: 'USD',

    getFacetType: facet => {
      if (facet.name === 'Colour' || facet.name === 'Farbe') {
        return 'COLOR';
      }

      if (facet.name === 'Size' || facet.name === 'Größe') {
        return 'SIZE';
      }

      if (facet.name === 'Category' || facet.name === 'Kategorie') {
        return 'CATEGORY';
      }

      return facet.multiSelect ? 'MULTI_SELECT' : 'SINGLE_SELECT';
    },

    transformImageUrl: url => {
      if (SAPCC_MEDIA_HOST) {
        return new URL(url, SAPCC_MEDIA_HOST).toString();
      }

      const [imagePathWithoutParams, searchParams = ''] = url.split('?');
      const segmentsParameter = imagePathWithoutParams.split('/').filter(Boolean);
      const sapContextSearchParameter = new URLSearchParams(searchParams).get('context');
      return `sap/${segmentsParameter}/context/${sapContextSearchParameter}`;
    }
  },

  isNamespaced: true,

  normalizers: {
    addCustomFields: [{}, normalizerCustomFields]
  },

  methods: {
    override: {
      ...b2bCoreOverrideMethods,
      ...b2bCheckoutOverrideMethods
    }
  }
});
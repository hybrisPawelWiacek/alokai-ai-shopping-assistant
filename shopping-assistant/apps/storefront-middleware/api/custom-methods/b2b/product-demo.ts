import { type IntegrationContext } from "../../../types";
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";
import type { 
  ScheduleProductDemoArgs, 
  ProductDemoResponse, 
  DemoProduct,
  CalendarInvite 
} from './types';

/**
 * Schedule product demonstration for B2B customers
 */
export async function scheduleProductDemo(
  context: IntegrationContext,
  args: ScheduleProductDemoArgs
): Promise<ProductDemoResponse> {
  const { productIds, preferredTimes, attendees, customerId, demoType, notes } = args;
  
  try {
    // Validate B2B authorization
    const customer = await context.api.getCustomer();
    if (!customer.isB2B) {
      throw new Error('Product demos are only available for B2B customers');
    }
    
    // Verify customer access
    if (customerId !== customer.uid) {
      throw new Error('Customer ID mismatch');
    }
    
    // Validate products exist
    const { normalizeProduct } = getNormalizers(context);
    const productPromises = productIds.map(id => context.api.getProduct({ code: id }));
    const products = await Promise.all(productPromises);
    
    const demoProducts: DemoProduct[] = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product) {
        throw new Error(`Product ${productIds[i]} not found`);
      }
      
      // Access CMS for demo materials
      let demoMaterials: string[] = [];
      try {
        const cmsClient = await context.getApiClient("cntf");
        // TODO: Fetch actual demo materials from CMS based on product
        // const content = await cmsClient.api.getContent({ 
        //   contentType: 'productDemo',
        //   filters: { productId: productIds[i] }
        // });
        
        // Mock demo materials
        demoMaterials = [
          `https://demos.company.com/${product.code}/overview`,
          `https://demos.company.com/${product.code}/technical-specs.pdf`,
          `https://demos.company.com/${product.code}/use-cases.pdf`
        ];
      } catch (error) {
        console.warn('Could not fetch demo materials from CMS:', error);
      }
      
      demoProducts.push({
        productId: productIds[i],
        name: product.name,
        demoMaterials
      });
    }
    
    // TODO: Real integration with calendar/scheduling system
    // const calendarService = await context.getApiClient("calendar");
    // const availability = await calendarService.api.checkAvailability({
    //   times: preferredTimes,
    //   duration: 45, // minutes
    //   type: demoType
    // });
    // const booking = await calendarService.api.createBooking({
    //   time: availability.bestSlot,
    //   attendees: attendees,
    //   products: demoProducts,
    //   notes: notes
    // });
    
    // Mock scheduling - pick first available time
    const scheduledTime = preferredTimes[0];
    const demoId = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    
    // Assign sales specialist based on products and customer
    const salesRep = assignProductSpecialist(demoProducts, customer);
    
    // Generate meeting details
    const meetingDetails = generateMeetingDetails(demoType, demoId);
    
    // Create calendar invites
    const calendarInvite = generateCalendarInvites(
      demoId,
      scheduledTime,
      attendees,
      demoProducts,
      meetingDetails,
      salesRep
    );
    
    return {
      demoId,
      status: 'scheduled',
      scheduledTime: {
        ...scheduledTime,
        duration: 45 // 45 minute demo
      },
      meetingDetails,
      salesRep,
      products: demoProducts,
      calendarInvite
    };
    
  } catch (error) {
    console.error('Error in scheduleProductDemo:', error);
    throw error;
  }
}

function assignProductSpecialist(products: DemoProduct[], customer: any) {
  // Mock assignment based on product category
  // In real implementation, this would check sales team availability
  const specialists = {
    'industrial': {
      name: 'Robert Chen',
      email: 'robert.chen@company.com',
      phone: '+1-555-0201',
      title: 'Industrial Solutions Specialist'
    },
    'electronics': {
      name: 'Lisa Martinez',
      email: 'lisa.martinez@company.com',
      phone: '+1-555-0202',
      title: 'Electronics Product Expert'
    },
    'software': {
      name: 'David Kumar',
      email: 'david.kumar@company.com',
      phone: '+1-555-0203',
      title: 'Software Solutions Architect'
    }
  };
  
  // Default specialist
  return specialists.industrial;
}

function generateMeetingDetails(demoType: string, demoId: string) {
  if (demoType === 'virtual') {
    return {
      type: 'virtual' as const,
      location: `https://meet.company.com/demo/${demoId}`,
      joinInstructions: 'Click the link to join. No download required. Please test your audio/video before the meeting.'
    };
  } else {
    return {
      type: 'in-person' as const,
      location: '123 Business Park, Suite 400, Dallas, TX 75201',
      joinInstructions: 'Please check in at reception. Free parking available in Lot B.'
    };
  }
}

function generateCalendarInvites(
  demoId: string,
  scheduledTime: any,
  attendees: any[],
  products: DemoProduct[],
  meetingDetails: any,
  salesRep: any
): CalendarInvite {
  // Generate calendar invite URLs
  const baseUrl = 'https://calendar.company.com/demos';
  
  // ICS file for download
  const icsUrl = `${baseUrl}/${demoId}/invite.ics`;
  
  // Google Calendar link
  const googleParams = new URLSearchParams({
    text: `Product Demo: ${products.map(p => p.name).join(', ')}`,
    dates: formatGoogleCalendarDates(scheduledTime),
    details: generateEventDescription(products, meetingDetails, salesRep),
    location: meetingDetails.location
  });
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&${googleParams}`;
  
  // Outlook web link
  const outlookParams = new URLSearchParams({
    subject: `Product Demo: ${products.map(p => p.name).join(', ')}`,
    startdt: scheduledTime.date + 'T' + scheduledTime.time,
    enddt: calculateEndTime(scheduledTime),
    body: generateEventDescription(products, meetingDetails, salesRep),
    location: meetingDetails.location
  });
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams}`;
  
  return {
    icsUrl,
    googleCalendarUrl,
    outlookUrl
  };
}

function formatGoogleCalendarDates(scheduledTime: any): string {
  // Format: 20230415T120000Z/20230415T130000Z
  const start = new Date(`${scheduledTime.date}T${scheduledTime.time}`);
  const end = new Date(start.getTime() + 45 * 60 * 1000); // 45 minutes later
  
  return `${formatDateToISO(start)}/${formatDateToISO(end)}`;
}

function formatDateToISO(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function calculateEndTime(scheduledTime: any): string {
  const start = new Date(`${scheduledTime.date}T${scheduledTime.time}`);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  return end.toISOString();
}

function generateEventDescription(products: DemoProduct[], meetingDetails: any, salesRep: any): string {
  let description = 'Product Demonstration\n\n';
  description += `Products:\n${products.map(p => `- ${p.name}`).join('\n')}\n\n`;
  description += `Your Specialist: ${salesRep.name} (${salesRep.email})\n\n`;
  description += `${meetingDetails.joinInstructions}\n\n`;
  description += 'We look forward to showing you how our products can benefit your business!';
  
  return description;
}
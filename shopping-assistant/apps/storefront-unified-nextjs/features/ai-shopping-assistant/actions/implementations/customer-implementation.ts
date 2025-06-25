import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';

/**
 * Customer account action implementations using UDL
 */

export async function loginImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    email: z.string().email(),
    password: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Login using UDL
    const loginResult = await sdk.unified.loginCustomer({
      email: validated.email,
      password: validated.password
    });
    
    // Get customer profile
    const customer = await sdk.unified.getCustomer();
    
    let response = `✅ **Welcome back, ${customer.firstName}!**\n\n`;
    response += `You are now logged in as ${customer.email}.\n`;
    
    if (state.mode === 'b2b' && customer.company) {
      response += `\n**Company:** ${customer.company}\n`;
      response += `**Account Type:** Business\n`;
      response += '\n💼 *B2B features are now available: bulk ordering, net terms, and tax exemption.*';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'login',
            result: {
              success: true,
              customerId: customer.id,
              customerName: `${customer.firstName} ${customer.lastName}`
            }
          }
        }
      })
    });

    // Update context with customer info
    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        customerId: customer.id,
        customerEmail: customer.email,
        isAuthenticated: true
      }
    });

    // Enable customer-specific actions
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['getProfile', 'updateProfile', 'manageAddresses', 'getOrders', 'logout'],
        disabled: ['login', 'register']
      }
    });

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: '❌ Login failed. Please check your email and password.',
        additional_kwargs: {
          tool_use: {
            name: 'login',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Login failed')
    });
  }

  return commands;
}

export async function registerImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string(),
    lastName: z.string(),
    company: z.string().optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Register new customer
    const registerResult = await sdk.unified.registerCustomer({
      email: validated.email,
      password: validated.password,
      firstName: validated.firstName,
      lastName: validated.lastName
    });
    
    // If B2B, update profile with company
    if (validated.company) {
      await sdk.unified.updateCustomer({
        company: validated.company
      });
    }
    
    let response = `🎉 **Welcome, ${validated.firstName}!**\n\n`;
    response += `Your account has been created successfully.\n`;
    response += `**Email:** ${validated.email}\n`;
    
    if (validated.company) {
      response += `**Company:** ${validated.company}\n\n`;
      response += '💼 *Your business account is ready. Contact our sales team to set up:*\n';
      response += '• Net payment terms\n';
      response += '• Volume pricing\n';
      response += '• Tax exemption status\n';
    } else {
      response += '\n🛍️ *You can now save addresses, track orders, and access exclusive member benefits.*';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'register',
            result: {
              success: true,
              customerId: registerResult.customer.id
            }
          }
        }
      })
    });

    // Update context
    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        customerId: registerResult.customer.id,
        customerEmail: validated.email,
        isAuthenticated: true
      }
    });

    // Enable customer actions
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['getProfile', 'updateProfile', 'manageAddresses', 'logout'],
        disabled: ['login', 'register']
      }
    });

  } catch (error) {
    let errorMessage = '❌ Registration failed. ';
    if (error instanceof Error && error.message.includes('exists')) {
      errorMessage += 'This email is already registered.';
    } else {
      errorMessage += 'Please try again.';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: errorMessage,
        additional_kwargs: {
          tool_use: {
            name: 'register',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Registration failed')
    });
  }

  return commands;
}

export async function getProfileImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    const customer = await sdk.unified.getCustomer();
    
    let response = '👤 **Customer Profile**\n\n';
    response += `**Name:** ${customer.firstName} ${customer.lastName}\n`;
    response += `**Email:** ${customer.email}\n`;
    
    if (customer.phone) {
      response += `**Phone:** ${customer.phone}\n`;
    }
    
    if (customer.company) {
      response += `**Company:** ${customer.company}\n`;
      response += `**Account Type:** Business\n`;
    } else {
      response += `**Account Type:** Personal\n`;
    }
    
    if (customer.createdAt) {
      const memberSince = new Date(customer.createdAt).toLocaleDateString();
      response += `**Member Since:** ${memberSince}\n`;
    }
    
    // Get addresses count
    const addresses = await sdk.unified.getCustomerAddresses();
    response += `\n**Saved Addresses:** ${addresses.length}`;
    
    if (state.mode === 'b2b') {
      response += '\n\n💼 **B2B Features Available:**\n';
      response += '• Bulk ordering\n';
      response += '• Net payment terms\n';
      response += '• Tax exemption\n';
      response += '• Dedicated account manager';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getProfile',
            result: { customer }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: '❌ Unable to retrieve profile. Please log in first.',
        additional_kwargs: {
          tool_use: {
            name: 'getProfile',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to get profile')
    });
  }

  return commands;
}

export async function updateProfileImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Update customer profile
    const updatedCustomer = await sdk.unified.updateCustomer(validated);
    
    let response = '✅ **Profile Updated Successfully**\n\n';
    response += '**Updated Information:**\n';
    
    if (validated.firstName || validated.lastName) {
      response += `• Name: ${updatedCustomer.firstName} ${updatedCustomer.lastName}\n`;
    }
    if (validated.email) {
      response += `• Email: ${updatedCustomer.email}\n`;
    }
    if (validated.phone) {
      response += `• Phone: ${updatedCustomer.phone}\n`;
    }
    if (validated.company) {
      response += `• Company: ${updatedCustomer.company}\n`;
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'updateProfile',
            result: { customer: updatedCustomer }
          }
        }
      })
    });

    // Update context if email changed
    if (validated.email) {
      commands.push({
        type: 'UPDATE_CONTEXT',
        payload: {
          customerEmail: validated.email
        }
      });
    }

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: '❌ Failed to update profile. Please try again.',
        additional_kwargs: {
          tool_use: {
            name: 'updateProfile',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to update profile')
    });
  }

  return commands;
}

export async function changePasswordImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Change password
    await sdk.unified.changeCustomerPassword({
      currentPassword: validated.currentPassword,
      newPassword: validated.newPassword
    });
    
    const response = '✅ **Password Changed Successfully**\n\nYour password has been updated. Please use your new password for future logins.';

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'changePassword',
            result: { success: true }
          }
        }
      })
    });

  } catch (error) {
    let errorMessage = '❌ Failed to change password. ';
    if (error instanceof Error && error.message.includes('incorrect')) {
      errorMessage += 'Current password is incorrect.';
    } else {
      errorMessage += 'Please try again.';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: errorMessage,
        additional_kwargs: {
          tool_use: {
            name: 'changePassword',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to change password')
    });
  }

  return commands;
}

export async function logoutImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Logout
    await sdk.unified.logoutCustomer();
    
    const response = '👋 **Logged Out Successfully**\n\nThank you for visiting. See you again soon!';

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'logout',
            result: { success: true }
          }
        }
      })
    });

    // Clear customer context
    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        customerId: undefined,
        customerEmail: undefined,
        isAuthenticated: false
      }
    });

    // Update available actions
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['login', 'register'],
        disabled: ['getProfile', 'updateProfile', 'manageAddresses', 'getOrders', 'logout']
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to logout')
    });
  }

  return commands;
}

export async function manageAddressesImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    action: z.enum(['list', 'add', 'update', 'delete', 'setDefault']),
    addressId: z.string().optional(),
    address: z.object({
      firstName: z.string(),
      lastName: z.string(),
      address1: z.string(),
      address2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
      phone: z.string().optional(),
      isDefault: z.boolean().optional()
    }).optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    let response = '';
    
    switch (validated.action) {
      case 'list': {
        const addresses = await sdk.unified.getCustomerAddresses();
        
        if (addresses.length === 0) {
          response = '📍 **No Saved Addresses**\n\nYou haven\'t saved any addresses yet.';
        } else {
          response = `📍 **Saved Addresses (${addresses.length})**\n\n`;
          
          addresses.forEach((addr, index) => {
            response += `**${index + 1}. ${addr.firstName} ${addr.lastName}**`;
            if (addr.isDefault) response += ' ⭐ *Default*';
            response += '\n';
            response += `${addr.address1}\n`;
            if (addr.address2) response += `${addr.address2}\n`;
            response += `${addr.city}, ${addr.state} ${addr.postalCode}\n`;
            response += `${addr.country}\n`;
            if (addr.phone) response += `Phone: ${addr.phone}\n`;
            response += '\n';
          });
        }
        
        commands.push({
          type: 'ADD_MESSAGE',
          payload: new AIMessage({
            content: response,
            additional_kwargs: {
              tool_use: {
                name: 'manageAddresses',
                result: { addresses }
              }
            }
          })
        });
        break;
      }
      
      case 'add': {
        if (!validated.address) {
          throw new Error('Address data is required for adding');
        }
        
        const newAddress = await sdk.unified.createCustomerAddress(validated.address);
        
        response = '✅ **Address Added Successfully**\n\n';
        response += `${newAddress.firstName} ${newAddress.lastName}\n`;
        response += `${newAddress.address1}\n`;
        if (newAddress.address2) response += `${newAddress.address2}\n`;
        response += `${newAddress.city}, ${newAddress.state} ${newAddress.postalCode}\n`;
        response += `${newAddress.country}`;
        
        commands.push({
          type: 'ADD_MESSAGE',
          payload: new AIMessage({
            content: response,
            additional_kwargs: {
              tool_use: {
                name: 'manageAddresses',
                result: { address: newAddress }
              }
            }
          })
        });
        break;
      }
      
      case 'update': {
        if (!validated.addressId || !validated.address) {
          throw new Error('Address ID and data are required for updating');
        }
        
        const updatedAddress = await sdk.unified.updateCustomerAddress({
          addressId: validated.addressId,
          ...validated.address
        });
        
        response = '✅ **Address Updated Successfully**';
        
        commands.push({
          type: 'ADD_MESSAGE',
          payload: new AIMessage({
            content: response,
            additional_kwargs: {
              tool_use: {
                name: 'manageAddresses',
                result: { address: updatedAddress }
              }
            }
          })
        });
        break;
      }
      
      case 'delete': {
        if (!validated.addressId) {
          throw new Error('Address ID is required for deletion');
        }
        
        await sdk.unified.deleteCustomerAddress({ addressId: validated.addressId });
        
        response = '✅ **Address Deleted Successfully**';
        
        commands.push({
          type: 'ADD_MESSAGE',
          payload: new AIMessage({
            content: response,
            additional_kwargs: {
              tool_use: {
                name: 'manageAddresses',
                result: { success: true }
              }
            }
          })
        });
        break;
      }
      
      case 'setDefault': {
        if (!validated.addressId) {
          throw new Error('Address ID is required for setting default');
        }
        
        // Update address to be default
        await sdk.unified.updateCustomerAddress({
          addressId: validated.addressId,
          isDefault: true
        });
        
        response = '✅ **Default Address Updated**';
        
        commands.push({
          type: 'ADD_MESSAGE',
          payload: new AIMessage({
            content: response,
            additional_kwargs: {
              tool_use: {
                name: 'manageAddresses',
                result: { success: true }
              }
            }
          })
        });
        break;
      }
    }

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ Failed to ${validated.action} address. ${error instanceof Error ? error.message : 'Please try again.'}`,
        additional_kwargs: {
          tool_use: {
            name: 'manageAddresses',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error(`Failed to ${validated.action} address`)
    });
  }

  return commands;
}
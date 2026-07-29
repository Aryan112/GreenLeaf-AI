/**
 * NEWSLETTER SUBSCRIPTION HANDLER
 * Standalone newsletter functionality
 */

console.log('📧 Newsletter.js loaded');

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletter);
} else {
    initNewsletter();
}

function initNewsletter() {
    console.log('🔧 Initializing newsletter handler...');
    
    const newsletterForm = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('newsletterEmail');
    const subscribeBtn = document.getElementById('newsletterSubscribe');
    const messageDiv = document.getElementById('newsletter-message');
    
    if (!newsletterForm) {
        console.warn('Newsletter form not found');
        return;
    }
    
    console.log('✅ Newsletter form found, attaching handler');
    
    // Handle form submission
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📧 Newsletter form submitted');
        
        const email = emailInput.value.trim();
        
        if (!email) {
            showMessage('Please enter your email address.', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        const originalText = subscribeBtn.textContent;
        subscribeBtn.textContent = 'Subscribing...';
        subscribeBtn.disabled = true;
        
        console.log(`Subscribing email: ${email}`);
        
        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });
            
            const data = await response.json();
            
            console.log('Response:', data);
            
            if (data.success) {
                showMessage(data.message, 'success');
                emailInput.value = '';
            } else {
                showMessage(data.message || 'Subscription failed. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            showMessage('Failed to subscribe. Please check your connection and try again.', 'error');
        } finally {
            subscribeBtn.textContent = originalText;
            subscribeBtn.disabled = false;
        }
    });
    
    // Handle button click (backup for browsers that don't trigger form submit)
    subscribeBtn.addEventListener('click', function(e) {
        console.log('Subscribe button clicked');
        // Let the form submit handler take care of it
    });
    
    // Handle Enter key
    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            newsletterForm.dispatchEvent(new Event('submit'));
        }
    });
    
    function showMessage(message, type) {
        console.log(`Showing message: [${type}] ${message}`);
        
        if (!messageDiv) {
            // Fallback to alert if message div not found
            alert(message);
            return;
        }
        
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        messageDiv.style.padding = '0.5rem';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.marginTop = '0.5rem';
        messageDiv.style.fontWeight = '500';
        
        if (type === 'success') {
            messageDiv.style.color = '#fff';
            messageDiv.style.backgroundColor = '#28a745';
        } else {
            messageDiv.style.color = '#fff';
            messageDiv.style.backgroundColor = '#dc3545';
        }
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    console.log('✅ Newsletter handler initialized successfully');
}

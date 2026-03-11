(function() {
            // 1. Cancel buttons: remove the parent <aside>
            const cancelButtons = document.querySelectorAll('.cancel-btn');
            cancelButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    // Find the closest <aside> that contains this button
                    const aside = this.closest('aside');
                    if (aside) {
                        // Remove the entire basket-item (the parent of section+aside)
                        // The <aside> is inside a .basket-item div, so we remove that whole div
                        const basketItem = aside.closest('.basket-item');
                        if (basketItem) {
                            basketItem.remove();
                        }
                    }
                });
            });

            // 2. Pay button: show modal
            const payButton = document.getElementById('payButton');
            const modal = document.getElementById('paymentModal');
            const acceptBtn = document.getElementById('modalAcceptBtn');

            if (payButton && modal && acceptBtn) {
                payButton.addEventListener('click', function() {
                    modal.classList.add('show');
                });

                acceptBtn.addEventListener('click', function() {
                    modal.classList.remove('show');
                });

                // Optional: close modal when clicking on overlay (but not on modal box)
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.classList.remove('show');
                    }
                });
            }
        })();
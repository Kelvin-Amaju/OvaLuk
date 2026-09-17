FROM php:8.3-apache
RUN docker-php-ext-install pdo_mysql && a2enmod rewrite headers
COPY . /var/www/appscope
ENV APACHE_DOCUMENT_ROOT=/var/www/appscope/public
RUN sed -ri 's!/var/www/html!/var/www/appscope/public!g' /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
 && printf '<Directory /var/www/appscope/public>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/appscope.conf \
 && a2enconf appscope


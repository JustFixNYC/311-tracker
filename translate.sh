# https://github.com/OzzyCzech/potrans
# clone repo
# install php:
  # brew install php
# install php composer (macos):
  # curl -sS https://getcomposer.org/installer | php
  # sudo mv composer.phar /usr/local/bin/composer

# If import to textit fails, run the translation file through this validator
# https://pofile.net/free-po-editor

# DEEPL_API_KEY
source .env 

export POTRANS_PATH="~/Downloads/potrans-master/bin"
export PATH="$PATH:$POTRANS_PATH"


# Haitian

potrans deepl textit/eng/311_tracker_upt_confirmation.eng.po textit/hat --from=en --to=ht --apikey="$DEEPL_API_KEY" -vvv
mv textit/hat/311_tracker_upt_confirmation.eng.po textit/hat/311_tracker_upt_confirmation.hat.po
rm textit/hat/311_tracker_upt_confirmation.eng.mo

potrans deepl textit/eng/311_tracker_upt_reminder.eng.po textit/hat --from=en --to=ht --apikey="$DEEPL_API_KEY" -vvv
mv textit/hat/311_tracker_upt_reminder.eng.po textit/hat/311_tracker_upt_reminder.hat.po
rm textit/hat/311_tracker_upt_reminder.eng.mo

potrans deepl textit/eng/311_tracker_upt_status_checker.eng.po textit/hat --from=en --to=ht --apikey="$DEEPL_API_KEY" -vvv
mv textit/hat/311_tracker_upt_status_checker.eng.po textit/hat/311_tracker_upt_status_checker.hat.po
rm textit/hat/311_tracker_upt_status_checker.eng.mo


# Spanish (Latin American)

potrans deepl textit/eng/311_tracker_upt_confirmation.eng.po textit/spa --from=en --to="ES-419" --apikey="$DEEPL_API_KEY" -vvv
mv textit/spa/311_tracker_upt_confirmation.eng.po textit/spa/311_tracker_upt_confirmation.spa.po
rm textit/spa/311_tracker_upt_confirmation.eng.mo

potrans deepl textit/eng/311_tracker_upt_reminder.eng.po textit/spa --from=en --to="ES-419" --apikey="$DEEPL_API_KEY" -vvv
mv textit/spa/311_tracker_upt_reminder.eng.po textit/spa/311_tracker_upt_reminder.spa.po
rm textit/spa/311_tracker_upt_reminder.eng.mo

potrans deepl textit/eng/311_tracker_upt_status_checker.eng.po textit/spa --from=en --to="ES-419" --apikey="$DEEPL_API_KEY" -vvv
mv textit/spa/311_tracker_upt_status_checker.eng.po textit/spa/311_tracker_upt_status_checker.spa.po
rm textit/spa/311_tracker_upt_status_checker.eng.mo
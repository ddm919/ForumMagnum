import { gql, useMutation } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import TextField from "@material-ui/core/TextField";
import React, { useState, useRef } from "react";
import { forumTypeSetting, siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMessages } from "../common/withMessages";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: 'white',
    padding: theme.spacing.unit * 6
  },
  title: {
    marginTop: 0
  },
  section: {
    marginTop: theme.spacing.unit * 6
  },
  sectionHelperText: {
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    fontSize: '1rem'
  },
  submitButtonSection: {
    marginTop: theme.spacing.unit * 3
  }
});

type NewUserCompleteProfileProps = {
  classes: ClassesType
}

function prefillUsername(maybeUsername: string | undefined | null): string {
  if (!maybeUsername) return ''
  if (/^\S+@\S+\.\S+$/.test(maybeUsername)) return ''
  if (/new_user_\d+/.test(maybeUsername)) return ''
  return maybeUsername
}

const NewUserCompleteProfile: React.FC<NewUserCompleteProfileProps> = ({ classes }) => {
  const currentUser = useCurrentUser()
  const [username, setUsername] = useState(prefillUsername(currentUser?.displayName))
  const emailInput = useRef<HTMLInputElement>(null)
  const [subscribeToDigest, setSubscribeToDigest] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [updateUser] = useMutation(gql`
    mutation NewUserCompleteProfile($username: String!, $subscribeToDigest: Boolean!, $email: String) {
      NewUserCompleteProfile(username: $username, subscribeToDigest: $subscribeToDigest, email: $email) {
        username
        slug
        displayName
      }
    }
  `, {refetchQueries: ['getCurrentUser']})
  const {flash} = useMessages();
  const {SingleColumnSection, Typography} = Components

  function validateUsername(username: string): void {
    if (username.length === 0) {
      setValidationError('Please enter a username')
      return
    }
    if (username.length > 70) {
      setValidationError('username too long')
      return
    }
    // TODO: Really want them to be able to tell live if their username is
    // taken, but I think that's gonna have to be a later PR.
    // Note: Probably want to prevent someone from taking an existing
    // displayName
    // if (usernameIsUnique) ...
    setValidationError('')
  }
  
  async function handleSave() {
    try {
      if (validationError) return
      
      // TODO: loading spinner while running
      await updateUser({variables: {
        username,
        subscribeToDigest,
        // We do this fancy spread so we avoid setting the email to an empty
        // string in the likely event that someone already had an email and
        // wasn't shown the set email field
        ...(!currentUser?.email && {email: emailInput.current?.value})
      }})
    } catch (err) {
      if (/duplicate key error/.test(err.toString?.())) {
        setValidationError('Username already taken')
      }
      // eslint-disable-next-line no-console
      console.error(err)
      flash(`${err}`)
    }
  }
  
  return <SingleColumnSection>
    <div className={classes.root}>
      <Typography variant='display3' gutterBottom className={classes.title}>
        Thanks for registering for {siteNameWithArticleSetting.get()}
      </Typography>
      <Typography variant='body2'>
        Please take a second to complete your profile
      </Typography>
      <div className={classes.section}>
        <Typography variant='display1' gutterBottom>Please choose a username</Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          This is the name that people will see when you post or comment.
        </Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          We encourage you to use your real name, because this will help other
          people in the community to identify you, but you can choose a pseudonym
          if you'd prefer.
        </Typography>
        <TextField
          label='Username'
          error={!!validationError}
          helperText={validationError || 'Spaces and special characters allowed'}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onBlur={(_event) => validateUsername(username)}
        />
      </div>
      
      {/* Facebook user with no email fix (very small % of users) */}
      {!currentUser?.email && <div className={classes.section}>
        <Typography variant='display1' gutterBottom>Please enter your email</Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          {/* I'd rather be honest than concise here. */}
          To get here without an email you must have logged in with Facebook
          and not given Facebook your email. We need your email to notify you of
          direct messages, and having a tiny percentage of users without an
          email makes the site harder to maintain.
        </Typography>
        <TextField
          label='Email'
          inputRef={emailInput}
        />
      </div>}
      
      {forumTypeSetting.get() === 'EAForum' && <div className={classes.section}>
        <Typography variant='display1' gutterBottom>Would you like to get digest emails?</Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          The EA Forum Digest is a weekly summary of the best content, curated by the EA Forum team.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={subscribeToDigest}
              onChange={event => setSubscribeToDigest(event.target.checked)}
            />
          }
          label='Yes, subscribe me to EA Forum digest emails'
        />
      </div>}
      {/* TODO: Something about bio? */}
      <div className={classes.submitButtonSection}>
        <Button
          onClick={handleSave}
          color='primary'
          variant='outlined'
          disabled={!!validationError}
        >
          Save
        </Button>
      </div>
    </div>
  </SingleColumnSection>
};

const NewUserCompleteProfileComponent = registerComponent(
  "NewUserCompleteProfile",
  NewUserCompleteProfile,
  { styles }
);

declare global {
  interface ComponentTypes {
    NewUserCompleteProfile: typeof NewUserCompleteProfileComponent;
  }
}

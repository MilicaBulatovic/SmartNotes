import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotesViewComponent } from './pages/notes-view/notes-view.component';
import { NewListComponent } from './pages/new-list/new-list.component';
import { NewNoteComponent } from './pages/new-note/new-note.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { EditListComponent } from './pages/edit-list/edit-list.component';
import { EditNoteComponent } from './pages/edit-note/edit-note.component';

const routes: Routes = [
  {
    path: '', redirectTo: '/signup', pathMatch: 'full'
  },
  {
    path: 'new-list', component: NewListComponent
  },
  {
    path: 'edit-list/:listId', component: EditListComponent
  },
  {
    path: 'login' , component: LoginPageComponent
  },
  {
    path: 'signup' , component: SignupPageComponent
  },
  {
    path: 'lists/:listId' , component: NotesViewComponent
  },
  {
    path: 'lists' , component: NotesViewComponent
  },
  {
    path: 'lists/:listId/new-note' , component: NewNoteComponent
  },
  {
    path: 'lists/:listId/edit-note/:noteId', component: EditNoteComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
